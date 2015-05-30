#!/usr/bin/perl -w
use strict;
use warnings;

use IO::Handle;

use Carp::Assert;

use MCE;
use MCE::Queue;
use MCE::Mutex;

use Bio::Tools::Run::Alignment::Clustalw;
use Bio::SeqIO;
use Bio::TreeIO;

# TODO: Come up with a better name for this file.
# TODO: Add the xls output?

# $| = 1; # Turn on stdout flushing

# reassign STDERR
open my $log_fh, '>>', './output/STDERR.out';
*STDERR = $log_fh;

open my $pots_fh, '>', './output/pots.out';

# --------------------
# Utiliy
# --------------------

# Takes two strings as arguments.
# Returns a single string consisting of the
# argument strings, sorted in alphabetical
# order and separated by a comma.
# This is primarily used to generate hash keys for 2-element unordered sets.
sub pair_string {
    return join ",", sort @_;
}


# --------------------
# Record Processing
# --------------------

sub GenBank_get_loci_data {
    my ($file_name) = @_;

    my %loci; # hash of loci by accession number
    my %loci_lists; # hash of lists of accession numbers by species name

    my $in  = Bio::SeqIO->new(-file => $file_name ,
                         -format => 'genbank');

    while ( my $seq = $in->next_seq() ) {

        my $accession_number = $seq->accession_number;
        my $binomial = $seq->species->binomial;

        $loci{$accession_number} = $seq;

        # Build lists of indices for each species so we can properly
        # pair species when we build the three-way trees
        # (1 list of indices per species)

        if (exists $loci_lists{$binomial}) {
            push ( $loci_lists{$binomial}, $accession_number );
        }
        else {
            $loci_lists{$binomial} = [ $accession_number ];
        }

    }

    return (\%loci, \%loci_lists);
}



# --------------------
# Sequence Processing
# --------------------

sub list_species {
    my ( $loci_lists ) = @_;
    return sort keys %$loci_lists;
}


# --------------------
# Tree Analysis
# --------------------

# Returns a three-way tree built from the sequences identified
# by the provided indices in the provided similarity matrix.
# The tree sets each branch's length to the distance of its
# terminal node from the common ancestor.
sub clustal_tree {
    my ($triple, $loci, $factory) = @_;

    # Indices:
    my $A1_accession = $triple->[0];
    my $A2_accession = $triple->[1];
    my $B_accession = $triple->[2];

    # Sequences:
    my $A1 = $$loci{ $A1_accession };
    my $A2 = $$loci{ $A2_accession };
    my $B  = $$loci{ $B_accession  };

    # Build alignent object, then build tree:
    my $alignment = $$factory->align([$A1, $A2, $B]);
    my $tree      = $$factory->tree($alignment);

    return \$tree;
}

# Returns the internal tree representation that gets stored and is used
# to check for potential hybridization.
# Representation looks like [A, B, C], where B and C are the closest pair
# in terms of evolutionary distance. A, B, and C are accession number strings.
sub internal_tree {
    my ($tree) = @_;

    my $root = $$tree->get_root_node;
    my @desc = $root->get_all_Descendents;

    my ($A_accession) = $desc[0]->id =~ /(.*)\//;

    # Sort descendents.
    @desc = sort { $a->branch_length <=> $b->branch_length } @desc; #TODO: never tested this sort to see if it works properly

    # If distance between last two is greater than first two after sorting,
    # reverse the array to group loci properly.
    if ( abs($desc[0]->branch_length - $desc[1]->branch_length)
        < abs($desc[1]->branch_length - $desc[2]->branch_length) ) {
        @desc = reverse( @desc );
    }

    # Map the accession numbers from desc to tree in the same order.
    my @tree = map { $_->id =~ /(.*)\// } @desc;

    return \@tree;

}

# Returns 0 if the provided tree is not an instance of hybridization,
# and 1 if the provided tree is an instance of hybridization.
# Compares the closer-distance group to see if the accession
# numbers identify sequences from different species.
# Assumes [A, B, C] representation, where B and C are closer.
sub potential_hybridization {
    my ($tree, $loci) = @_;

    my $B_species = $$loci{$$tree[1]}->species->binomial;
    my $C_species = $$loci{$$tree[2]}->species->binomial;

    if ($B_species ne $C_species) {
        return 1;
    }
    return 0;
}

# --------------------
# Dealing with triples
# --------------------

sub list_loci {
    my ($loci_lists, $binomial_A) = @_;
    return $$loci_lists{ $binomial_A };
}

sub pair_list_loci {
    my ($loci_lists, $binomial_A, $binomial_B) = @_;
    return [ list_loci($loci_lists, $binomial_A),
             list_loci($loci_lists, $binomial_B) ];
}

sub num_triples {
    # Predicts the number of triples based on a reference to the pair_list_loci
    my ( $pair_list_loci ) = @_;

    my $m = scalar @{$$pair_list_loci[ 0 ]};
    my $n = scalar @{$$pair_list_loci[ 1 ]};
    my $cnt = (($m-1) * $m / 2) * $n
            + (($n-1) * $n / 2) * $m;

    return $cnt;
}

sub loci_triples {
    my ( $pair_list_loci ) = @_;

    my @triples;

    my $m = scalar @{$$pair_list_loci[ 0 ]};
    my $n = scalar @{$$pair_list_loci[ 1 ]};
    print STDERR "$m loci in list 1, $n loci in list 2\n";
    my $cnt = (($m-1) * $m / 2) * $n
            + (($n-1) * $n / 2) * $m;
    print STDERR "Triple count estimate: ";
    print STDERR $cnt;
    print STDERR "\n";

    # `scalar @{ $$pair_list_loci[0] }` gives size of the list of loci for binomial A
    for (my $i = 0;          $i < scalar @{$$pair_list_loci[ 0 ]}; ++$i) {
        for (my $j = $i + 1; $j < scalar @{$$pair_list_loci[ 0 ]}; ++$j) {
            for (my $k = 0;  $k < scalar @{$$pair_list_loci[ 1 ]}; ++$k) {
                push (@triples, [ $$pair_list_loci[0]->[$i],
                                  $$pair_list_loci[0]->[$j],
                                  $$pair_list_loci[1]->[$k] ]);
            }
        }
    }
    for (my $i = 0;          $i < scalar @{$$pair_list_loci[ 1 ]}; ++$i) {
        for (my $j = $i + 1; $j < scalar @{$$pair_list_loci[ 1 ]}; ++$j) {
            for (my $k = 0;  $k < scalar @{$$pair_list_loci[ 0 ]}; ++$k) {
                push (@triples, [ $$pair_list_loci[1]->[$i],
                                  $$pair_list_loci[1]->[$j],
                                  $$pair_list_loci[0]->[$k] ]);
            }
        }
    }


    print STDERR "Final triple count: ";
    print STDERR scalar @triples;
    print STDERR "\n";

    return \@triples;

}



# --------------------
# Main processing function
# --------------------


# Hash, keyed by binomial of frame species, of hashes, keyed by the pair
# of accession numbers in the hinge of a potential hybridization tree in
# the [A, B, C] form, of lists of matching trees.
#
# Basically if you do $potential_hybridizations{frame_binomial}->{hinge} you get a ref
# to an array of the matching trees.
#
# This is file-scope so that we can use it to query during processing.
#
# TODO: Revise docs to mention references ^^^^^
my %potential_trees; # Internal store of potential trees
my %pair_progress; # { pair_string } -> [ 6 , 11 ] means 6 triples processed, 11 total


sub get_pair_progress {
    my ($pair_key) = @_;
    return $pair_progress{ $pair_key };
}

sub set_pair_progress {
    my ($pair_key, $complete, $total) = @_;
    $pair_progress{ $pair_key } = [$complete, $total];
};

sub increment_pair_progress { # Ensure key exists before calling this!
    my ($pair_key) = @_;
    $pair_progress{ $pair_key }->[0] += 1;
};

sub report_pair_progress {
    my ($pair_key) = @_;
    my $progress = $pair_progress{ $pair_key };
    print STDERR "($pair_key): $$progress[0] / $$progress[1]\n";
}


sub add_potential_tree {
    my ($frame, $hinge, $tree) = @_;

    #check for hinge hash at frame
    if (exists $potential_trees{ $frame }) {
        #check for array at hinge
        if (exists $potential_trees{ $frame }->{ $hinge }) {
            push( $potential_trees{ $frame }->{ $hinge }, $tree );
        }
        else {
            $potential_trees{ $frame }->{ $hinge } = [ $tree ];
        }
    }
    else {
        $potential_trees{ $frame } = {$hinge => [ $tree ]};
    }
};



sub print_potential_tree_hinges {
    my ($pair_key) = @_;

    print STDERR keys $potential_trees{ $pair_key };
}

sub find_hybridizations {
    my ($loci, $loci_lists, $factory) = @_;





    # sort these keys if you want more predictable order
    # of execution, but note that sorting will slow things
    # down, especially on jobs spanning many species
    my @binomial_list = keys %$loci_lists;

    my $pair_queue = MCE::Queue->new( fast => 1 ); # Queue of species (binomial name) pairs to process.
    my $triple_queue = MCE::Queue->new( fast => 1 ); # Queue of pair_strings of species pairs that have a queue for triples set up.


    # TODO: Do we have to ask how many cores, then adjust max_workers manually?
    #       Use 'auto' option for max_workers?
    my $max_build_triples_workers = 1;
    my $max_test_potential_hybridization_workers = 4; # Set to 'auto' to max out machine. This will make your computer cry.

    # Build pair_queue
    for (my $i = 0; $i < scalar @binomial_list; ++$i) {
        for (my $j = $i + 1; $j < scalar @binomial_list; ++$j) {
            $pair_queue->enqueue( [$binomial_list[$i], $binomial_list[$j]] );
        }
    }
    $pair_queue->enqueue( (undef) x $max_build_triples_workers ); # Completion sentinels

    my $reporting_lock = MCE::Mutex->new();

    my $mce = MCE->new(
        task_end => sub {
            my ($mce, $task_id, $task_name) = @_;

            print STDERR "Task [$task_id -- $task_name] completed processing.\n";

            # When build_triples finishes and test_potential_hybridization is still running,
            # enqueue ((undef) x (# of workers)) in triple_queue,
            # which act as completion sentinels for the test_potential_hybridization workers.
            # The number of undefs needs to equal the number of workers for that task,
            # so that each worker knows to stop. (TODO: Is it really the workers that need to stop? I need to read the MCE architecture docs to be sure.)
            if ($task_id eq 0 && defined $mce->{user_tasks}->[1]) {
                print STDERR "Task $task_id -- $task_name end adding task 1 shutdown sentinels.";
                my $n_w = $mce->{user_tasks}->[1]->{max_workers};
                $triple_queue->enqueue( (undef) x $n_w );
            }
        },

        user_tasks => [{
           max_workers => $max_build_triples_workers,
           task_name => 'build_triples',
             # build_triples:
             # dequeues a pair from the binomial_pair_queue,
             # retrieves the accession numbers for each species,
             # sets up storage for progress metrics,
             # then starts generating triples and pushing them onto the queue for the pair.

           user_func => sub {
              while (defined ( my $pair = $pair_queue->dequeue() )) {
                # Generate triples and enqueue.
                my $pair_list_loci = pair_list_loci( $loci_lists, @$pair );

                # Put calculation of total pairs into the pair_progress hash:
                my $pair_key = pair_string($$pair[0], $$pair[1]);

                MCE->do('set_pair_progress', $pair_key, 0, num_triples( $pair_list_loci ));
                MCE->do('report_pair_progress', $pair_key);

                for (my $i = 0;          $i < scalar @{$$pair_list_loci[ 0 ]}; ++$i) {
                    for (my $j = $i + 1; $j < scalar @{$$pair_list_loci[ 0 ]}; ++$j) {
                        for (my $k = 0;  $k < scalar @{$$pair_list_loci[ 1 ]}; ++$k) {
                            $triple_queue->enqueue( [ $$pair_list_loci[0]->[$i],
                                                      $$pair_list_loci[0]->[$j],
                                                      $$pair_list_loci[1]->[$k] ]);
                        }
                    }
                }
                for (my $i = 0;          $i < scalar @{$$pair_list_loci[ 1 ]}; ++$i) {
                    for (my $j = $i + 1; $j < scalar @{$$pair_list_loci[ 1 ]}; ++$j) {
                        for (my $k = 0;  $k < scalar @{$$pair_list_loci[ 0 ]}; ++$k) {
                            $triple_queue->enqueue( [ $$pair_list_loci[1]->[$i],
                                                      $$pair_list_loci[1]->[$j],
                                                      $$pair_list_loci[0]->[$k] ]);
                        }
                    }
                }

              }
           } # End user_func
        },
        {
            max_workers => $max_test_potential_hybridization_workers,
            task_name => 'test_potential_hybridization', # Tests for potential hybridizations
            # test_potential_hybridization:
            # dequeues a triple from the triple_queue,
            # constructs its clustalw tree,
            # converts the clustalw tree to the internal representation,
            # checks the internal representation for potential hybridization,
            # if YES, stores a reference to that internal representation in the potential_trees hash
            user_func => sub {
                while ( defined ( my $triple = $triple_queue->dequeue() ) ) {
                    # Construct clustalw tree.
                    # Convert tree to internal representation.
                    my $tree = internal_tree( clustal_tree($triple, $loci, $factory) );
                    # Check for potential hybridization.
                    if ( potential_hybridization($tree, $loci) ) {
                        my ( $A, $B, $C ) = @$tree;
                        my $frame = $$loci{ $A }->species->binomial;
                        my $hinge = pair_string($B, $C);
                        MCE->do('add_potential_tree', $frame, $hinge, $tree);

                        # Output
                        $reporting_lock->lock();

                            my $first = $tree->[0];
                            my $second = $tree->[1];
                            my $third = $tree->[2];
                            MCE->say($pots_fh, qq([$first,$second,$third],));
                            MCE->say(\*STDERR, qq(Found potential hybrid: [$first,$second,$third]));
                        $reporting_lock->unlock();
                    }

                    # Update pair progress. # Distinct names will be on edges of sorted array.
                    my @binomials = sort map { $$loci{ $_ }->species->binomial; } @$tree;
                    my $pair_key = pair_string( $binomials[ 0 ], $binomials[ 2 ] );

                    MCE->do('increment_pair_progress', $pair_key);

                    $reporting_lock->lock();
                        MCE->do('report_pair_progress', $pair_key);
                    $reporting_lock->unlock();

                }
            }
        }]

    )->run();


}

sub output_reciprocals {
    my $fh = shift @_;

    # For now, just print all instances of hybridization to a file.
    my @binomials = keys %potential_trees;
    print qq(Potential hybrids found in these species: @binomials\n);
    for (my $i = 0; $i < scalar @binomials; ++$i) {
        my $binomial_A = $binomials[$i];
        # If a hinge doesn't exist for both species, no reciprocal non-monophyly,
        # and we can ignore that hinge pair, so we only need the list of hinges
        # from one species.
        my @hinges = keys %{$potential_trees{ $binomial_A }};
        for (my $j = $i+1; $j < scalar @binomials; ++$j) {
            my $binomial_B = $binomials[$j];
            print $fh qq(between:$binomial_A,$binomial_B\n);
            for (my $k = 0; $k < scalar @hinges; ++$k) {
                # We know potential hybrids with this hinge exist for A,
                # do any exist for B?
                if (exists $potential_trees{ $binomial_B }{ $hinges[$k] }) {
                    my $hinge = $hinges[$k];
                    my $A_framed = $potential_trees{ $binomial_A }{ $hinge };
                    my $B_framed = $potential_trees{ $binomial_B }{ $hinge };
                    print $fh qq(hinge:($hinge)\n);
                    print $fh qq(frame:$binomial_A:);
                    my $cur_tree;
                    my $first;
                    my $second;
                    my $third;
                    for (my $a = 0; $a < scalar @{$A_framed}; ++$a) {
                        $cur_tree = $A_framed->[$a];
                        $first = $cur_tree->[0];
                        $second = $cur_tree->[1];
                        $third = $cur_tree->[2];
                        print $fh qq([$first,$second,$third],);
                    }
                    print $fh qq(\n);
                    print $fh qq(frame:$binomial_B:);
                    for (my $b = 0; $b < scalar @{$B_framed}; ++$b) {
                        $cur_tree = $B_framed->[$b];
                        $first = $cur_tree->[0];
                        $second = $cur_tree->[1];
                        $third = $cur_tree->[2];
                        print $fh qq([$first,$second,$third],);
                    }
                    print $fh qq(\n);
                }
            }

        }
    }


}


sub start {
    my ( $loci, $loci_lists ) = GenBank_get_loci_data('./trionychcytb.gb');


    # Construct factory object:
    # Factory to build alignments using clustalw
    # ktuple = word size to be used in the alignment
    # TODO: add params for how trees get built
    my @params = (   'ktuple' => 2
                    ,'matrix' => 'BLOSUM'
                    ,'quiet' => 1
                    );
    my $factory = \(Bio::Tools::Run::Alignment::Clustalw->new(@params)); #TODO: See if this works for making a ref

    find_hybridizations( $loci, $loci_lists, $factory );

    # After processing, launch UI to view data
    my $outfilename = './output/hybrids.out';
    open (my $fh, '>', $outfilename) or die "Could not open file '$outfilename' $!";
    output_reciprocals($fh);

}


# --------------------
# A Few Tests
# --------------------
sub run_tests {
    print STDERR "Running Tests:\n";

    print STDERR "Utilities:\n";
    assert(pair_string("DEF","ABC") eq "ABC,DEF", "pair_string(\"DEF\",\"ABC\") eq \"ABC,DEF\"") if DEBUG;
    assert(pair_string("ABC","DEF") eq "ABC,DEF", "pair_string(\"ABC\",\"DEF\") eq \"ABC,DEF\"") if DEBUG;

    print STDERR "OK\n";

    # ---------------------------------------------------------------------------------------------

    print STDERR "Data checks:\n";

    my ( $loci, $loci_lists ) = GenBank_get_loci_data('./smallerlepus.gb');

    assert(scalar keys %$loci > 0, "%loci is non-empty") if DEBUG;
    assert(scalar keys %$loci_lists > 0, "%loci_lists is non-empty") if DEBUG;

    print STDERR "OK\n";
    # ---------------------------------------------------------------------------------------------
    print STDERR "list_loci:\n";

    print STDERR "binomial A: "; print STDERR $$loci{((keys %$loci)[0])}->species->binomial; print STDERR "\n";

    assert( ref( list_loci($loci_lists, $$loci{((keys %$loci)[0])}->species->binomial) ) eq "ARRAY",
        "list_loci returns an array ref.") if DEBUG;

    print STDERR "OK\n";
    # ---------------------------------------------------------------------------------------------
    print STDERR "pair_list_loci:\n";

    my $binomial_A = $$loci{((keys %$loci)[0])}->species->binomial;
    my $binomial_B = $$loci{((keys %$loci)[1])}->species->binomial;

    print STDERR "binomial A: ";
    print STDERR $binomial_A;
    print STDERR "\nbinomial B: ";
    print STDERR $binomial_B;
    print STDERR "\n";

    my $pair_list = pair_list_loci( $loci_lists,
        $binomial_A,
        $binomial_B );

    affirm {
        my $r = $pair_list;
        return ref($r) eq "ARRAY" && scalar @$r eq 2 && ref($$r[0]) eq "ARRAY" && ref($$r[1]) eq "ARRAY";
    } "pair_list_loci returns an array ref to an array containing two array refs." if DEBUG;



    print STDERR "OK\n";
    # ---------------------------------------------------------------------------------------------

    #TODO: Write some tests for the rest of these
    print STDERR "loci_triples:\n";
    # Well now this takes a while...
    #loci_triples( pair_list_loci($loci_lists, $binomial_A, $binomial_B) );
    print STDERR "OK\n";
    # ---------------------------------------------------------------------------------------------
    print STDERR "clustal_tree:\n";
    print STDERR "OK (no tests)\n";
    # ---------------------------------------------------------------------------------------------
    print STDERR "internal_tree:\n";
    print STDERR "OK (no tests)\n";
    # ---------------------------------------------------------------------------------------------
    print STDERR "potential_hybridization:\n";
    print STDERR "OK (no tests)\n";
    # ---------------------------------------------------------------------------------------------

}



# --------------------
# Main
# --------------------

#run_tests();
start();



print STDERR "\n";


